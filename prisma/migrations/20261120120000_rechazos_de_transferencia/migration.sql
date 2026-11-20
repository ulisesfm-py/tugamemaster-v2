-- Cuantas veces ha rechazado Stripe la transferencia de una partida. Entra
-- en la clave de idempotencia para que un reintento tras un rechazo llegue
-- de verdad a Stripe (ver src/modules/payments/transferencias.ts).
-- Solo anade una columna con valor por defecto: compatible con el codigo
-- anterior.
ALTER TABLE "Payout" ADD COLUMN "rejectedAttempts" INTEGER NOT NULL DEFAULT 0;
