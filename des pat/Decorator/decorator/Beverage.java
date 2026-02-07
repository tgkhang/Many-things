package decorator;

public abstract class Beverage{
	protected String description = "Unknow Beverage";
	public String getDescription(){
		return description;
	}
	public abstract double cost();
}
