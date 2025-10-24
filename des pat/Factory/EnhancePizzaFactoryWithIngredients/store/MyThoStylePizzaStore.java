package store;

import ingredientsFactory.MyThoPizzaIngredientFactory;
import ingredientsFactory.PizzaIngredientFactory;
import pizza.CheesePizza;
import pizza.ClamPizza;
import pizza.PepperoniPizza;
import pizza.Pizza;
import pizza.VeggiePizza;

public class MyThoStylePizzaStore extends PizzaStore {

	public MyThoStylePizzaStore() {
		super();
	}

	@Override
	protected Pizza createPizza(String type) {
		Pizza pizza = null;

		// Produce the ingredients for all MyTho style pizzas.
		PizzaIngredientFactory ingredientFactory = new MyThoPizzaIngredientFactory();

		if (type.equals("cheese")) {
			pizza = new CheesePizza(ingredientFactory);
			pizza.setName("MyTho Style Cheese Pizza");
		} else if (type.equals("veggie")) {
			pizza = new VeggiePizza(ingredientFactory);
			pizza.setName("MyTho Style Veggie Pizza");
		} else if (type.equals("clam")) {
			pizza = new ClamPizza(ingredientFactory);
			pizza.setName("MyTho Style Clam Pizza");
		} else if (type.equals("pepperoni")) {
			pizza = new PepperoniPizza(ingredientFactory);
			pizza.setName("MyTho Style Pepperoni Pizza");
		}
		return pizza;
	}

}