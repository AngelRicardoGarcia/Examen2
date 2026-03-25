/*
 * ====================================================================
 * FIRMWARE: Control de Motor DC con Puente H
 * Examen Segundo Parcial
 * ====================================================================
 * Comandos:
 *   MOTOR:0-255  - Controlar velocidad PWM
 *   SENSOR       - Leer temperatura
 *   STATUS       - Obtener estado completo
 *   STOP         - Detener motor
 *   HELP         - Mostrar ayuda
 * ====================================================================
 */

// ==================== CONFIGURACIÓN ====================
// Selecciona tu placa (descomenta la que uses)
// #define ARDUINO_UNO
#define ESP32

#ifdef ESP32
  // Pines para ESP32
  #define ENA 5          // PWM velocidad - GPIO 5
  #define IN1 18         // Control dirección 1 - GPIO 18
  #define IN2 19         // Control dirección 2 - GPIO 19
  #define DHTPIN 4       // Sensor DHT11 - GPIO 4
#else
  // Pines para Arduino Uno/Nano
  #define ENA 3          // PWM pin 3
  #define IN1 4          // Pin 4
  #define IN2 5          // Pin 5
  #define DHTPIN 2       // Pin 2
#endif

#define DHTTYPE DHT11

#include <DHT.h>

DHT dht(DHTPIN, DHTTYPE);

int velocidadActual = 0;
float temperaturaActual = 0.0;
String rangoActual = "Esperando datos";
String estadoSistema = "OK";

void actualizarRango() {
  if (temperaturaActual < 25.0) {
    rangoActual = "BAJO (<25°C)";
  }
  else if (temperaturaActual >= 25.0 && temperaturaActual <= 30.0) {
    rangoActual = "MEDIO (25-30°C)";
  }
  else if (temperaturaActual > 30.0) {
    rangoActual = "ALTO (>30°C)";
  }
  else {
    rangoActual = "INDEFINIDO";
  }
}

void setup() {
  Serial.begin(9600);
  Serial.setTimeout(50);
  
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
  
  dht.begin();
  
  Serial.println("OK:MOTOR_SYSTEM_READY");
  delay(1000);
}

void loop() {
  static unsigned long lastRead = 0;
  if (millis() - lastRead >= 2000) {
    leerSensor();
    actualizarMotorPorTemperatura();
    lastRead = millis();
  }
  
  procesarComandos();
}

void leerSensor() {
  float temp = dht.readTemperature();
  
  if (isnan(temp)) {
    estadoSistema = "ERROR:SENSOR";
    return;
  }
  
  temperaturaActual = temp;
  estadoSistema = "OK";
  actualizarRango();
}

void actualizarMotorPorTemperatura() {
  int velocidadObjetivo;
  
  if (temperaturaActual < 25.0) {
    velocidadObjetivo = 76;
  }
  else if (temperaturaActual >= 25.0 && temperaturaActual <= 30.0) {
    velocidadObjetivo = 153;
  }
  else if (temperaturaActual > 30.0) {
    velocidadObjetivo = 255;
  }
  else {
    velocidadObjetivo = 0;
  }
  
  if (velocidadObjetivo != velocidadActual) {
    velocidadActual = velocidadObjetivo;
    analogWrite(ENA, velocidadActual);
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
  }
}

void procesarComandos() {
  if (!Serial.available()) return;
  
  String comando = Serial.readStringUntil('\n');
  comando.trim();
  
  if (comando.length() == 0) return;
  
  if (comando.startsWith("MOTOR:")) {
    int valor = comando.substring(6).toInt();
    if (valor < 0) valor = 0;
    if (valor > 255) valor = 255;
    
    velocidadActual = valor;
    analogWrite(ENA, velocidadActual);
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    
    Serial.print("OK:MOTOR:");
    Serial.println(velocidadActual);
  }
  
  else if (comando.equals("SENSOR")) {
    Serial.print("OK:TEMP:");
    Serial.println(temperaturaActual, 1);
  }
  
  else if (comando.equals("STATUS")) {
    Serial.print("STATUS:");
    Serial.print(temperaturaActual, 1);
    Serial.print(",");
    Serial.print(velocidadActual);
    Serial.print(",");
    Serial.print(rangoActual);
    Serial.print(",");
    Serial.println(estadoSistema);
  }
  
  else if (comando.equals("STOP")) {
    velocidadActual = 0;
    analogWrite(ENA, 0);
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    Serial.println("OK:STOP");
  }
  
  else if (comando.equals("HELP")) {
    Serial.println("OK:Comandos: MOTOR:0-255, SENSOR, STATUS, STOP, HELP");
  }
  
  else {
    Serial.print("ERR:");
    Serial.println(comando);
  }
}
