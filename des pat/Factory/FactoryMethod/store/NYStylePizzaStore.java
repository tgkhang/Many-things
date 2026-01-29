package store;

import pizza.NYStyleCheesePizza;
import pizza.NYStyleClamPizza;
import pizza.NYStyleVeggiePizza;
import pizza.Pizza;

public class NYStylePizzaStore extends PizzaStore {

	public NYStylePizzaStore() {
		super();
	}

	@Override
	protected Pizza createPizza(String type) {
		Pizza pizza = null;

		if (type.equals("cheese")) {
			pizza = new NYStyleCheesePizza();
		} else if (type.equals("veggie")) {
			pizza = new NYStyleVeggiePizza();
		} else if (type.equals("clam")) {
			pizza = new NYStyleClamPizza();
		}

		return pizza;
	}

}
