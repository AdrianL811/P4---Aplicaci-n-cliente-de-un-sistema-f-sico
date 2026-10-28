package mx.ciberpunks.credencialhce

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.nfc.NfcAdapter
import android.nfc.cardemulation.CardEmulation
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Módulo de Expo que expone a JavaScript el control de la credencial NFC.
 * El envío de bytes al lector lo hace CredencialApduService; este módulo sólo
 * guarda el número de usuario, informa el estado del NFC y reenvía eventos a JS.
 */
class CredencialHceModule : Module() {

  private val context: Context
    get() = appContext.reactContext
      ?: throw CodedException("ERR_NO_CONTEXT", "Contexto de Android no disponible", null)

  /** Si la pantalla de credencial pidió prioridad, la reafirmamos al volver al frente. */
  private var preferredRequested = false

  override fun definition() = ModuleDefinition {
    Name("CredencialHce")

    Events("onScannerDetected", "onScannerLost")

    OnCreate {
      HceBridge.listener = { event, payload -> sendEvent(event, payload) }
    }

    OnDestroy {
      HceBridge.listener = null
    }

    OnActivityEntersForeground {
      if (preferredRequested) applyPreferred(true)
    }

    OnActivityEntersBackground {
      if (preferredRequested) applyPreferred(false)
    }

    /** Estado del hardware y de la credencial guardada. */
    Function("getStatus") {
      val ctx = context
      val adapter = NfcAdapter.getDefaultAdapter(ctx)
      val hasHce = ctx.packageManager.hasSystemFeature(PackageManager.FEATURE_NFC_HOST_CARD_EMULATION)
      val id = CredencialStore.userId(ctx)
      val order = CredencialStore.order(ctx)
      mapOf(
        "hasNfc" to (adapter != null),
        "hasHce" to hasHce,
        "nfcEnabled" to (adapter?.isEnabled == true),
        "isDefaultForAid" to isDefaultForAid(ctx, adapter),
        "aid" to CredencialApduService.AID.toHex(),
        "userId" to id?.toDouble(),
        "byteOrder" to order.code,
        "payloadHex" to id?.let { CredencialStore.toBytes(it, order).toHex() }
      )
    }

    /** Guarda el número de usuario que el servicio HCE enviará al lector. Devuelve los 4 bytes en hex. */
    Function("setUserId") { id: Double, byteOrder: String? ->
      if (id < 0 || id > 4294967295.0 || id != Math.floor(id)) {
        throw CodedException("ERR_INVALID_ID", "El número de usuario debe ser un entero de 0 a 4294967295", null)
      }
      val ctx = context
      val order = if (byteOrder == null) CredencialStore.order(ctx) else CredencialStore.ByteOrder.from(byteOrder)
      CredencialStore.save(ctx, id.toLong(), order)
      CredencialStore.toBytes(id.toLong(), order).toHex()
    }

    /** Al cerrar sesión el teléfono deja de presentar credencial. */
    Function("clearUserId") {
      CredencialStore.clear(context)
    }

    /** Pide a Android que, mientras la app esté al frente, este servicio tenga prioridad para el AID. */
    Function("setForegroundPreferred") { enabled: Boolean ->
      preferredRequested = enabled
      applyPreferred(enabled)
    }

    Function("openNfcSettings") {
      val intent = Intent(Settings.ACTION_NFC_SETTINGS)
      val activity = appContext.currentActivity
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }
  }

  private fun component(ctx: Context) = ComponentName(ctx, CredencialApduService::class.java)

  private fun isDefaultForAid(ctx: Context, adapter: NfcAdapter?): Boolean? {
    if (adapter == null) return null
    return try {
      CardEmulation.getInstance(adapter).isDefaultServiceForAid(component(ctx), "F012345678")
    } catch (e: Exception) {
      null
    }
  }

  private fun applyPreferred(enabled: Boolean) {
    val activity = appContext.currentActivity ?: return
    try {
      val adapter = NfcAdapter.getDefaultAdapter(activity) ?: return
      val emulation = CardEmulation.getInstance(adapter)
      if (enabled) {
        emulation.setPreferredService(activity, component(activity))
      } else {
        emulation.unsetPreferredService(activity)
      }
    } catch (e: Exception) {
      Log.w(CredencialApduService.TAG, "setPreferredService falló: ${e.message}")
    }
  }
}
