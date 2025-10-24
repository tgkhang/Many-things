package store;

import ingredientsFactory.NYPizzaIngredientFactory;
import ingredientsFactory.PizzaIngredientFactory;
import pizza.CheesePizza;
import pizza.ClamPizza;
import pizza.PepperoniPizza;
import pizza.Pizza;
import pizza.VeggiePizza;

public class NYStylePizzaStore extends PizzaStore {

	public NYStylePizzaStore() {
		super();
	}

	@Override
	protected Pizza createPizza(String type) {
		Pizza pizza = null;

		// Produce the ingredients for all NY style pizzas.
		PizzaIngredientFactory ingredientFactory = new NYPizzaIngredientFactory();

		if (type.equals("cheese")) {
			// each pizza the factory that should be used to produce its ingredients.
			pizza = new CheesePizza(ingredientFactory);
			pizza.setName("New York Style Cheese Pizza");
		} else if (type.equals("veggie")) {
			pizza = new VeggiePizza(ingredientFactory);
			pizza.setName("New York Style Veggie Pizza");
		} else if (type.equals("clam")) {
			pizza = new ClamPizza(ingredientFactory);
			pizza.setName("New York Style Clam Pizza");
		} else if (type.equals("pepperoni")) {
			pizza = new PepperoniPizza(ingredientFactory);
			pizza.setName("New York Style Pepperoni Pizza");
		}
		return pizza;
	}

}
