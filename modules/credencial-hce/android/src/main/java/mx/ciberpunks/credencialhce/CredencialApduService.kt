package mx.ciberpunks.credencialhce

import android.content.Context
import android.nfc.cardemulation.HostApduService
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

/**
 * Servicio de emulación de tarjeta (HCE).
 *
 * Flujo con el lector PN532 + Arduino Nano ESP32 (firmware ScannerHTTP.ino):
 *   1. El lector detecta el teléfono como tarjeta ISO 14443-4.
 *   2. Envía  SELECT AID:  00 A4 04 00 05 F0 12 34 56 78 00
 *   3. Android enruta el comando a este servicio porque el AID F012345678
 *      está registrado en res/xml/credencial_apduservice.xml.
 *   4. Respondemos  [ID0 ID1 ID2 ID3] 90 00  (4 bytes del número de usuario + "éxito").
 *   5. El Arduino consulta al servidor y enciende el LED verde o rojo.
 *      La app NO sabe ni muestra si se concedió el acceso.
 */
class CredencialApduService : HostApduService() {

  override fun processCommandApdu(commandApdu: ByteArray?, extras: Bundle?): ByteArray {
    if (commandApdu == null || commandApdu.size < 4) {
      return SW_UNKNOWN
    }
    Log.d(TAG, "APDU IN: ${commandApdu.toHex()}")

    val response: ByteArray
    var credencialEnviada = false
    var idEnviado: Long? = null

    if (!isSelect(commandApdu)) {
      // El firmware sólo usa SELECT; cualquier otra instrucción no está soportada.
      response = SW_INS_NOT_SUPPORTED
    } else if (!selectsOurAid(commandApdu)) {
      response = SW_FILE_NOT_FOUND
    } else {
      val id = CredencialStore.userId(this)
      if (id == null) {
        // Sin sesión iniciada no presentamos ninguna credencial.
        response = SW_CONDITIONS_NOT_SATISFIED
      } else {
        val order = CredencialStore.order(this)
        response = CredencialStore.toBytes(id, order) + SW_OK
        credencialEnviada = true
        idEnviado = id
      }
    }

    Log.d(TAG, "APDU OUT: ${response.toHex()}")
    vibrate(if (credencialEnviada) 120L else 40L)

    HceBridge.emit(
      "onScannerDetected",
      mapOf(
        "credentialSent" to credencialEnviada,
        "userId" to idEnviado?.toDouble(),
        "apduIn" to commandApdu.toHex(),
        "apduOut" to response.toHex(),
        "timestamp" to System.currentTimeMillis().toDouble()
      )
    )
    return response
  }

  override fun onDeactivated(reason: Int) {
    Log.d(TAG, "onDeactivated reason=$reason")
    HceBridge.emit(
      "onScannerLost",
      mapOf(
        "reason" to if (reason == DEACTIVATION_LINK_LOSS) "link_loss" else "deselected",
        "timestamp" to System.currentTimeMillis().toDouble()
      )
    )
  }

  private fun isSelect(apdu: ByteArray) =
    apdu[0] == 0x00.toByte() && apdu[1] == 0xA4.toByte() && apdu[2] == 0x04.toByte()

  private fun selectsOurAid(apdu: ByteArray): Boolean {
    if (apdu.size < 5) return false
    val lc = apdu[4].toInt() and 0xFF
    if (apdu.size < 5 + lc) return false
    return apdu.copyOfRange(5, 5 + lc).contentEquals(AID)
  }

  @Suppress("DEPRECATION")
  private fun vibrate(ms: Long) {
    try {
      val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
      } else {
        getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        vibrator?.vibrate(ms)
      }
    } catch (e: Exception) {
      Log.w(TAG, "No se pudo vibrar: ${e.message}")
    }
  }

  companion object {
    const val TAG = "CredencialHCE"

    /** Debe coincidir con el AID que envía el firmware y con credencial_apduservice.xml */
    val AID = byteArrayOf(0xF0.toByte(), 0x12, 0x34, 0x56, 0x78)

    val SW_OK = byteArrayOf(0x90.toByte(), 0x00)
    val SW_FILE_NOT_FOUND = byteArrayOf(0x6A, 0x82.toByte())
    val SW_INS_NOT_SUPPORTED = byteArrayOf(0x6D, 0x00)
    val SW_CONDITIONS_NOT_SATISFIED = byteArrayOf(0x69, 0x85.toByte())
    val SW_UNKNOWN = byteArrayOf(0x6F, 0x00)
  }
}

/**
 * Puente entre el servicio (que vive fuera del ciclo de vida de React) y el módulo de Expo.
 * Si la interfaz no está abierta no hay listener y el evento simplemente se descarta.
 */
object HceBridge {
  @Volatile
  var listener: ((String, Map<String, Any?>) -> Unit)? = null

  fun emit(event: String, payload: Map<String, Any?>) {
    try {
      listener?.invoke(event, payload)
    } catch (e: Exception) {
      Log.w(CredencialApduService.TAG, "No se pudo notificar a JS: ${e.message}")
    }
  }
}
