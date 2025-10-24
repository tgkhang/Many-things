package modernDisplay;
import java.util.concurrent.Flow;

public class ModernForecastDisplay implements Flow.Subscriber<ModernWeatherData.WeatherInfo> {

    private Flow.Subscription subscription;
    private float currentPressure = 29.92f;
    private float lastPressure;

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        subscription.request(1);
    }

    @Override
    public void onNext(ModernWeatherData.WeatherInfo weatherInfo) {
        lastPressure = currentPressure;
        currentPressure = weatherInfo.getPressure();
        display();
        subscription.request(1);
    }

    @Override
    public void onError(Throwable throwable) {
        System.err.println("Error in ForecastDisplay: " + throwable.getMessage());
    }

    @Override
    public void onComplete() {
        System.out.println("ForecastDisplay: No more weather updates");
    }

    public void display() {
        System.out.print("Forecast: ");
   
    }
}