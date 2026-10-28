package mx.ciberpunks.credencialhce

import android.content.Context

/**
 * Persistencia del número de usuario que se emite por NFC.
 *
 * Se guarda en SharedPreferences (igual que la app de ejemplo del profesor) porque el
 * servicio HCE puede ejecutarse aunque la parte de JavaScript no esté cargada:
 * Android despierta el proceso de la app sólo para atender al lector.
 */
object CredencialStore {
  private const val PREFS = "CREDENCIAL_HCE"
  private const val KEY_ID = "USER_ID"
  private const val KEY_ORDER = "BYTE_ORDER"

  /** Orden de bytes por omisión. Ver explicación en [ByteOrder]. */
  val DEFAULT_ORDER = ByteOrder.LITTLE_ENDIAN

  enum class ByteOrder(val code: String) {
    /**
     * El firmware ScannerHTTP.ino copia los 4 bytes recibidos a un uint32_t con memcpy().
     * El ESP32 es little-endian, así que el byte 0 es el menos significativo.
     * Enviar el ID en little-endian hace que el Arduino reconstruya exactamente el mismo número.
     */
    LITTLE_ENDIAN("LE"),

    /** Orden de la app de ejemplo en Kotlin (Int2ByteArray). Útil si el firmware cambia. */
    BIG_ENDIAN("BE");

    companion object {
      fun from(code: String?): ByteOrder = values().firstOrNull { it.code == code } ?: DEFAULT_ORDER
    }
  }

  private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun save(ctx: Context, id: Long, order: ByteOrder) {
    prefs(ctx).edit().putLong(KEY_ID, id).putString(KEY_ORDER, order.code).apply()
  }

  fun clear(ctx: Context) {
    prefs(ctx).edit().remove(KEY_ID).apply()
  }

  /** Devuelve null si no hay sesión: en ese caso el teléfono no presenta credencial. */
  fun userId(ctx: Context): Long? {
    val p = prefs(ctx)
    return if (p.contains(KEY_ID)) p.getLong(KEY_ID, 0L) else null
  }

  fun order(ctx: Context): ByteOrder = ByteOrder.from(prefs(ctx).getString(KEY_ORDER, null))

  /** Convierte el ID (0 … 4 294 967 295) en los 4 bytes que viajan dentro de la respuesta APDU. */
  fun toBytes(id: Long, order: ByteOrder): ByteArray {
    val b0 = (id and 0xFF).toByte()
    val b1 = ((id shr 8) and 0xFF).toByte()
    val b2 = ((id shr 16) and 0xFF).toByte()
    val b3 = ((id shr 24) and 0xFF).toByte()
    return when (order) {
      ByteOrder.LITTLE_ENDIAN -> byteArrayOf(b0, b1, b2, b3)
      ByteOrder.BIG_ENDIAN -> byteArrayOf(b3, b2, b1, b0)
    }
  }
}

fun ByteArray.toHex(): String = joinToString(" ") { "%02X".format(it) }
