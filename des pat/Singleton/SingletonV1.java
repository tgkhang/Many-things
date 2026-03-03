public class SingletonV1 {
    private static SingletonV1 instance;

    private SingletonV1() {
        // Private constructor to prevent instantiation
    }

    public static SingletonV1 getInstance() {
        if (instance == null) {
            instance = new SingletonV1();
        }
        return instance;
    }

    // other methods here
}