
public class SingletonV3 {
    private volatile static SingletonV3 instance = new SingletonV3();

    private SingletonV3(){}

    public static Singleton getInstance() {
        if (uniqueInstance == null) {
            synchronized (Singleton.class) {
                if (uniqueInstance == null) {
                    uniqueInstance = new Singleton();
                }
            }
        }
        return uniqueInstance;
    }
}