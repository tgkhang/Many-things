// guarantee that instance will be created before any thread access
// this version solve the problem of performance issue of synchronized method and synchronized
//  but it has a drawback: instance is created even if the client application might not be using it.

public class SingletonV3 {
    private static SingletonV3 instance = new SingletonV3();

    private SingletonV3() {
    }

    public static SingletonV3 getInstance() {
        return instance;
    }
}