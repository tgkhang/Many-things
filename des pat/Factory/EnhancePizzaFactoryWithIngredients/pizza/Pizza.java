package pizza;

import ingredients.*;
import java.util.ArrayList;
import java.util.List;

public abstract class Pizza {
	// Each pizza holds a set of ingredients that are used in its preparation
	protected String name;
	protected Dough dough;
	protected Sauce sauce;

	protected Veggies veggies[];
	protected Cheese cheese;
	protected Pepperoni pepperoni;
	protected Clams clams;

	protected List<String> toppings = new ArrayList<>();

	public abstract void prepare();

	public void bake() {
		System.out.println("Bake for 25 minutes at 350");
	}

	public void cut() {
		System.out.println("Cutting the pizza into diagonal slices");
	}

	public void box() {
		System.out.println("Place pizza in official PizzaStore box");
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}