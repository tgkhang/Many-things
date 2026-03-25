package Command;

public class SimpleRemoteControl {
    Command slot; // 1 slot to hold the command control 1 device

    public SimpleRemoteControl() {
    }

    // this will be called mutiple time if the client want to change the device to control
    public void setCommand(Command command) {
        slot = command;
    }

    public void buttonWasPressed() {
        slot.execute();
    }
}