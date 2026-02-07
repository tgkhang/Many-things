package observer;

// Object implement this interface if they want to be notified of changes in the Subject
public interface Observer {
    void update(float temp, float humidity, float pressure);
}