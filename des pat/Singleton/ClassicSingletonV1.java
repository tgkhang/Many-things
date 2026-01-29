public class ClassicSingleton {
    private static ClassicSingleton instance;

    private ClassicSingleton() {
        // Private constructor to prevent instantiation
    }

    // By adding the synchronized , force every thread to wait its turn before it can access the getInstance() method.
    // no more than one thread can execute this method at a time.
    public static synchronized ClassicSingleton getInstance() {
        if (instance == null) {
            instance = new ClassicSingleton();
        }
        return instance;
    }

    // other methods here
}