package Command.devices;

public class GarageDoor {
    String location;

    public GarageDoor(String location) {
        this.location = location;
    }

    public void up() {
        System.out.println(location + " garage door is open");
    }

    public void down() {
        System.out.println(location + " garage door is closed");
    }
}
