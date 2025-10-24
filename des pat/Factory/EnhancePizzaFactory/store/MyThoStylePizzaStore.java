package store;

import pizza.MyThoStyleCheesePizza;
import pizza.MyThoStyleClamPizza;
import pizza.MyThoStyleVeggiePizza;
import pizza.Pizza;

public class MyThoStylePizzaStore extends PizzaStore {

	public MyThoStylePizzaStore() {
		super();
	}

	@Override
	protected Pizza createPizza(String type) {
		Pizza pizza = null;

		if (type.equals("cheese")) {
			pizza = new MyThoStyleCheesePizza();
		} else if (type.equals("veggie")) {
			pizza = new MyThoStyleVeggiePizza();
		} else if (type.equals("clam")) {
			pizza = new MyThoStyleClamPizza();
		}

		return pizza;
	}

}