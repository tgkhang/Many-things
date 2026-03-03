
public class SingletonV4 {
    private volatile static SingletonV4 instance = new SingletonV4();

    private SingletonV4() {
    }

    public static SingletonV4 getInstance() {
        if (instance == null) {
            synchronized (SingletonV4.class) {
                if (instance == null) {
                    instance = new SingletonV4();
                }
            }
        }
        return instance;
    }
}