#include <WiFi.h>
#include <DHT.h>
#include <WebSocketsServer.h>

// Wi-Fi credentials
const char *ssid = "A35 de Erik";
const char *password = "kauegayviado"; // Recomendo mudar isso futuramente por segurança 😅

// Pinos dos sensores e LED
#define DHTPIN 21
#define DHTTYPE DHT11
#define PROXIMITY_SENSOR_PIN 4
#define LEDPIN 2 // LED interno do ESP32

// Instâncias dos sensores e servidor WebSocket
DHT dht(DHTPIN, DHTTYPE);
WebSocketsServer webSocket = WebSocketsServer(81);

void setup() {
  Serial.begin(115200);
  delay(10);

  // Configurações iniciais dos sensores e LED
  pinMode(PROXIMITY_SENSOR_PIN, INPUT);
  pinMode(LEDPIN, OUTPUT);
  digitalWrite(LEDPIN, LOW);

  Serial.println("Sensor LM393 configurado.");

  // Conectando ao Wi-Fi
  Serial.println();
  Serial.print("Conectando a ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado.");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());

  // Inicializa o servidor WebSocket
  Serial.println("Iniciando servidor WebSocket...");
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  // Inicializa o sensor DHT
  dht.begin();
  Serial.println("Sensor DHT iniciado.");
}

void loop() {
  webSocket.loop();

  static int lastSensorState = HIGH;
  int sensorState = digitalRead(PROXIMITY_SENSOR_PIN);

  if (sensorState == LOW && lastSensorState == HIGH) {
    digitalWrite(LEDPIN, HIGH);
    Serial.println("Obstáculo detectado! Enviando mensagem 'LIGOU'...");
    webSocket.broadcastTXT("LIGOU");
  } else if (sensorState == HIGH && lastSensorState == LOW) {
    digitalWrite(LEDPIN, LOW);
    Serial.println("Obstáculo removido!");
  }

  lastSensorState = sensorState;

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    return;
  }

  Serial.print("Enviando dados para WebSocket: ");
  String payload = String(t) + "," + String(h);
  Serial.println(payload);
  webSocket.broadcastTXT(payload);

  delay(500);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("Cliente %d desconectado!\n", num);
      break;
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("Novo cliente conectado: %d.%d.%d.%d\n", ip[0], ip[1], ip[2], ip[3]);
      break;
    }
    case WStype_TEXT:
      Serial.printf("Recebido do cliente %d: %s\n", num, payload);
      break;
    case WStype_PING:
      Serial.println("Recebido PING, aguardando PONG...");
      break;
    case WStype_PONG:
      Serial.println("Recebido PONG, conexão saudável.");
      break;
  }
}
