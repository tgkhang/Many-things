//imoprt java.util.*;
import Pizza.*;

class BasicPizzaStore {
	SimplePizzaFactory factory;

	public BasicPizzaStore(SimplePizzaFactory factory) {
		this.factory = factory;
	}

	public Pizza orderPizza(String type) {
		Pizza pizza;

		pizza = factory.createPizza(type);

		pizza.prepare();
		pizza.bake();
		pizza.cut();
		pizza.box();

		return pizza;
	}
}