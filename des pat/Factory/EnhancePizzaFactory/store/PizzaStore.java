package store;

import pizza.Pizza;

public abstract class PizzaStore {

	public PizzaStore() {
		//this.factory = factory;
	}

	public Pizza orderPizza(String type) {
		Pizza pizza;

		//pizza = factory.createPizza(type);
		pizza = createPizza(type);


		pizza.prepare();
		pizza.bake();
		pizza.cut();
		pizza.box();

		return pizza;
	}

	/*
	orderPizza() is defined in the abstract PizzaStore, not the subclasses. 
	method has no idea which subclass is actually running the code and making the pizzas.
	*/
	// all the responsibility for create pizza has been moved into a method that act as a factory
	protected abstract Pizza createPizza(String type);

}