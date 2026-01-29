package ingredientsFactory;

import ingredients.original.Cheese;
import ingredients.original.Clams;
import ingredients.original.Dough;
import ingredients.original.Pepperoni;
import ingredients.original.Sauce;
import ingredients.original.Veggies;

public interface PizzaIngredientFactory {
	public Dough createDough();
	public Sauce createSauce();
	public Cheese createCheese();
	public Veggies[] createVeggies();
	public Pepperoni createPepperoni();
	public Clams createClam();
}