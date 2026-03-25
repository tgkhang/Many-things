package Command.devices;

public class Light {
    String location;

    public Light() {
        this.location = "";
    }

    public Light(String location) {
        this.location = location;
    }

    public void on() {
        System.out.println(location + " light is on");
    }

    public void off() {
        System.out.println(location + " light is off");
    }
}