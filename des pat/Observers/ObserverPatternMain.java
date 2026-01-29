import display.CurrentConditionsDisplay;
import display.ForecastDisplay;
import display.StatisticsDisplay;
import modernDisplay.ModernCurrentConditionsDisplay;
import modernDisplay.ModernForecastDisplay;
import modernDisplay.ModernStatisticsDisplay;
import modernDisplay.ModernWeatherData;

public class Main {
    public static void main(String[] args) {

        WeatherData weatherData = new WeatherData();

        CurrentConditionsDisplay currentDisplay = new CurrentConditionsDisplay(weatherData);
        StatisticsDisplay statisticsDisplay = new StatisticsDisplay(weatherData);
        ForecastDisplay forecastDisplay = new ForecastDisplay(weatherData);
        
        weatherData.setMeasurements(80, 65, 30.4f);
        weatherData.setMeasurements(82, 70, 29.2f);
        weatherData.setMeasurements(78, 90, 29.2f);










        // MODERN Implementation using FLOW API
        System.out.println("\n=== Modern Flow API Implementation ===");

        ModernWeatherData modernWeatherData = new ModernWeatherData();

        ModernCurrentConditionsDisplay modernCurrentDisplay = new ModernCurrentConditionsDisplay();
        ModernStatisticsDisplay modernStatisticsDisplay = new ModernStatisticsDisplay();
        ModernForecastDisplay modernForecastDisplay = new ModernForecastDisplay();

        modernWeatherData.subscribe(modernCurrentDisplay);
        modernWeatherData.subscribe(modernStatisticsDisplay);
        modernWeatherData.subscribe(modernForecastDisplay);

        modernWeatherData.setMeasurements(80, 65, 30.4f);
        modernWeatherData.setMeasurements(82, 70, 29.2f);
        modernWeatherData.setMeasurements(78, 90, 29.2f);

        // Allow time for async processing
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        modernWeatherData.close();
    }
}
