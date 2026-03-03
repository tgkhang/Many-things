/*
This version add synchronized to getInstance() prevent 2 user call 
this method for the first time at the same time, and create 2 instance of SingletonV3,
but after the first time, synchronization is totally unneeded overhead! 

use synchronized here can cause performance issues, because it forces every thread to wait its turn before it can access the getInstance() method.

USE case: only use this when this method is not causing substantial performance issues in your application,
this memthod is straightforward and easy to understand
*/

public class SingletonV2 {
    private static SingletonV2 uniqueInstance;

    private SingletonV2() {
        // Private constructor to prevent instantiation
    }

    public static synchronized SingletonV2 getInstance() {
        if (uniqueInstance == null) {
            uniqueInstance = new SingletonV2();
        }
        return uniqueInstance;
    }
}