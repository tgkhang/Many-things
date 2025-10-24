package modernDisplay;

import java.util.concurrent.Flow;
import java.util.ArrayList;

public class ModernStatisticsDisplay implements Flow.Subscriber<ModernWeatherData.WeatherInfo> {

    private Flow.Subscription subscription;
    private ArrayList<Float> temperatures = new ArrayList<>();

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        subscription.request(1);
    }

    @Override
    public void onNext(ModernWeatherData.WeatherInfo weatherInfo) {
        temperatures.add(weatherInfo.getTemperature());
        display();
        subscription.request(1);
    }

    @Override
    public void onError(Throwable throwable) {
        System.err.println("Error in StatisticsDisplay: " + throwable.getMessage());
    }

    @Override
    public void onComplete() {
        System.out.println("StatisticsDisplay: No more weather updates");
    }

    public void display() {
        System.out.println("Statistics");
    }
}