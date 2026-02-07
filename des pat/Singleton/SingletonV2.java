// guarantee that instance will be created before any thread access

public class SingletonV2 {
    private static SingletonV2 instance = new SingletonV2();

    private SingletonV2(){}

    public static SingletonV2 getInstance(){
        return instance;
    }
}