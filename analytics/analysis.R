# -----------------------------------------------------------------
# Proyecto Hotel PMS - Análisis Estadístico de Reservas y Ocupación
# -----------------------------------------------------------------

# 1. Cargar conjunto de datos
data <- read.csv("dataset_hotel.csv", stringsAsFactors = FALSE)

# 2. Resumen descriptivo general
print("--- RESUMEN GENERAL ---")
summary(data)

# 3. Métricas clave
total_reservas <- nrow(data)
tasa_cancelacion <- (sum(data$cancelled) / total_reservas) * 100
promedio_estancia <- mean(data$length_of_stay)
ingreso_promedio <- mean(data$total_amount[data$cancelled == 0])

cat("\nTotal Reservas:", total_reservas)
cat("\nTasa de Cancelación (%):", round(tasa_cancelacion, 2), "%")
cat("\nPromedio Noches por Reserva:", round(promedio_estancia, 2))
cat("\nIngreso Promedio por Reserva Confirmada: $", round(ingreso_promedio, 2), "\n")

# 4. Análisis por Tipo de Habitación
print("--- INGRESOS Y CANCELACIONES POR TIPO DE HABITACIÓN ---")
aggregate(cbind(total_amount, cancelled) ~ room_type, data = data, FUN = function(x) c(Promedio = mean(x), Total = sum(x)))

# 5. Exportar informe resumido a CSV
reporte <- data.frame(
  Metrica = c("Total Reservas", "Tasa Cancelacion (%)", "Estancia Promedio (dias)", "Ingreso Promedio ($)"),
  Valor = c(total_reservas, round(tasa_cancelacion, 2), round(promedio_estancia, 2), round(ingreso_promedio, 2))
)

write.csv(reporte, "informe_ejecutivo_hotel.csv", row.names = FALSE)
print("\n¡Informe 'informe_ejecutivo_hotel.csv' generado exitosamente!")