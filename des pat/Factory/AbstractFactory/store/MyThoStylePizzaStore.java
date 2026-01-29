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

		// Each pizza the factory that should be used to produce its ingredients.
		switch (type) {
			case "cheese":
				pizza = new CheesePizza(ingredientFactory);
				pizza.setName("MyTho Style Cheese Pizza");
				break;
			case "veggie":
				pizza = new VeggiePizza(ingredientFactory);
				pizza.setName("MyTho Style Veggie Pizza");
				break;
			case "clam":
				pizza = new ClamPizza(ingredientFactory);
				pizza.setName("MyTho Style Clam Pizza");
				break;
			case "pepperoni":
				pizza = new PepperoniPizza(ingredientFactory);
				pizza.setName("MyTho Style Pepperoni Pizza");
				break;
			default:
				// unknown type; pizza stays null
				break;
		}

		return pizza;
	}

}