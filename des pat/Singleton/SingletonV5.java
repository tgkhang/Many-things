/*
this version use double check lock, it is more efficient than synchronized method, because it only synchronize the first time when the instance is created, 
and after that, it will not synchronize anymore, so it will not cause performance issues.

keyword volatile is used to ensure that multiple threads handle the instance variable correctly when it is being initialized to the SingletonV5 instance.
*/

public class SingletonV5 {
    private volatile static SingletonV5 instance;

    private SingletonV5() {
    }

    public static SingletonV5 getInstance() {
        if (instance == null) {
            synchronized (SingletonV5.class) {
                if (instance == null) {
                    instance = new SingletonV5();
                }
            }
        }
        return instance;
    }

}
