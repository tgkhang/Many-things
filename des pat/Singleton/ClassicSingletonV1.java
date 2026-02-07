public class ClassicSingletonV1 {
    private static ClassicSingletonV1 instance;

    private ClassicSingletonV1() {
        // Private constructor to prevent instantiation
    }

    // By adding the synchronized , force every thread to wait its turn before it can access the getInstance() method.
    // no more than one thread can execute this method at a time.
    public static synchronized ClassicSingletonV1 getInstance() {
        if (instance == null) {
            instance = new ClassicSingleton();
        }
        return instance;
    }

    // other methods here
}