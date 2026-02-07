package store;

import ingredientsFactory.NYPizzaIngredientFactory;
import ingredientsFactory.PizzaIngredientFactory;
import pizza.CheesePizza;
import pizza.ClamPizza;
import pizza.PepperoniPizza;
import pizza.Pizza;
import pizza.VeggiePizza;

public class NYStylePizzaStore extends PizzaStoreAbstract {

	public NYStylePizzaStore() {
		super();
	}

	@Override
	protected Pizza createPizza(String type) {
		Pizza pizza = null;

		// Produce the ingredients for all NY style pizzas.
		PizzaIngredientFactory ingredientFactory = new NYPizzaIngredientFactory();

		// Each pizza the factory that should be used to produce its ingredients.
		switch (type) {
			case "cheese":
				pizza = new CheesePizza(ingredientFactory);
				pizza.setName("New York Style Cheese Pizza");
				break;
			case "veggie":
				pizza = new VeggiePizza(ingredientFactory);
				pizza.setName("New York Style Veggie Pizza");
				break;
			case "clam":
				pizza = new ClamPizza(ingredientFactory);
				pizza.setName("New York Style Clam Pizza");
				break;
			case "pepperoni":
				pizza = new PepperoniPizza(ingredientFactory);
				pizza.setName("New York Style Pepperoni Pizza");
				break;
			default:
				// unknown type; pizza remains null
				break;
		}
		return pizza;
	}

}
