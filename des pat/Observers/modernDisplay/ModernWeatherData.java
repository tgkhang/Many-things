package modernDisplay;
import java.util.concurrent.SubmissionPublisher;

public class ModernWeatherData extends SubmissionPublisher<ModernWeatherData.WeatherInfo> {

    public static class WeatherInfo {
        private final float temperature;
        private final float humidity;
        private final float pressure;

        public WeatherInfo(float temperature, float humidity, float pressure) {
            this.temperature = temperature;
            this.humidity = humidity;
            this.pressure = pressure;
        }

        public float getTemperature() { return temperature; }
        public float getHumidity() { return humidity; }
        public float getPressure() { return pressure; }

        @Override
        public String toString() {
            return String.format("WeatherInfo{temp=%.1f, humidity=%.1f, pressure=%.1f}",
                               temperature, humidity, pressure);
        }
    }

    private float temperature;
    private float humidity;
    private float pressure;

    public void setMeasurements(float temperature, float humidity, float pressure) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.pressure = pressure;

        WeatherInfo weatherInfo = new WeatherInfo(temperature, humidity, pressure);
        submit(weatherInfo);
    }

    @Override
    public void close() {
        super.close();
    }
}