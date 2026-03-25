// ============================================
// EXAMEN INTEGRADOR - PUENTE H + MOTOR + KY-028
// Rangos: ≥225 FRÍO | 210-224 TEMPLADO | <210 CALIENTE
// ============================================

// Pines para el puente H (L298N)
const int PIN_IN1 = 9;
const int PIN_IN2 = 10;
const int PIN_ENA = 5;  // PWM para velocidad

// Pin para el sensor KY-028
const int PIN_KY028 = A0;

// Rangos ajustados según mediciones reales
const int ZONA_FRIA = 225;      // ≥ 225 → Motor apagado
const int ZONA_TEMPLADA = 210;   // 210-224 → Motor velocidad media
// Por debajo de 210 → Motor velocidad máxima

// Velocidades PWM (0-255)
const int VELOCIDAD_APAGADO = 0;
const int VELOCIDAD_MEDIA = 170;
const int VELOCIDAD_ALTA = 255;

int valorSensor = 0;
int velocidadActual = 0;
int zonaActual = 1;
unsigned long lastSend = 0;
const unsigned long INTERVALO = 500;

const char* nombresZonas[] = {"FRÍO", "TEMPLADO", "CALIENTE"};

void setup() {
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_ENA, OUTPUT);
  
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  analogWrite(PIN_ENA, VELOCIDAD_APAGADO);
  
  Serial.begin(115200);
  Serial.println("Sistema iniciado - Sensor KY-028");
  Serial.println("Rangos: ≥225 FRÍO | 210-224 TEMPLADO | <210 CALIENTE");
}

void loop() {
  if (millis() - lastSend >= INTERVALO) {
    lastSend = millis();
    
    valorSensor = analogRead(PIN_KY028);
    
    if (valorSensor >= ZONA_FRIA) {
      zonaActual = 1;
      velocidadActual = VELOCIDAD_APAGADO;
    }
    else if (valorSensor >= ZONA_TEMPLADA) {
      zonaActual = 2;
      velocidadActual = VELOCIDAD_MEDIA;
    }
    else {
      zonaActual = 3;
      velocidadActual = VELOCIDAD_ALTA;
    }
    
    analogWrite(PIN_ENA, velocidadActual);
    
    // Enviar datos por serial
    Serial.print("SENSOR:");
    Serial.print(valorSensor);
    Serial.print(",ZONA:");
    Serial.print(zonaActual);
    Serial.print(",VEL:");
    Serial.println(velocidadActual);
  }
  
  // Procesar comandos entrantes
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd == "GET_STATE") {
      Serial.print("SENSOR:");
      Serial.print(valorSensor);
      Serial.print(",ZONA:");
      Serial.print(zonaActual);
      Serial.print(",VEL:");
      Serial.println(velocidadActual);
    }
    else {
      Serial.println("ERR:CMD");
    }
  }
}
