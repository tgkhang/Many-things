package modernDisplay;
import java.util.concurrent.Flow;

public class ModernCurrentConditionsDisplay implements Flow.Subscriber<ModernWeatherData.WeatherInfo> {

    private Flow.Subscription subscription;
    private float temperature;
    private float humidity;

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        subscription.request(1); // Request one item at a time
    }

    @Override
    public void onNext(ModernWeatherData.WeatherInfo weatherInfo) {
        this.temperature = weatherInfo.getTemperature();
        this.humidity = weatherInfo.getHumidity();
        display();
        subscription.request(1); // Request next item
    }

    @Override
    public void onError(Throwable throwable) {
        System.err.println("Error in CurrentConditionsDisplay: " + throwable.getMessage());
    }

    @Override
    public void onComplete() {
        System.out.println("CurrentConditionsDisplay: No more weather updates");
    }

    public void display() {
        System.out.println("Current conditions: " + temperature + "F degrees and " + humidity + "% humidity");
    }
}