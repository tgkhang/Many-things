package ingredientsFactory;

import ingredients.original.Cheese;
import ingredients.original.Clams;
import ingredients.original.Dough;
import ingredients.original.Pepperoni;
import ingredients.original.Sauce;
import ingredients.original.Veggies;
import ingredients.ny.NYFreshClams;
import ingredients.ny.NYGarlic;
import ingredients.ny.NYMarinaraSauce;
import ingredients.ny.NYMushroom;
import ingredients.ny.NYOnion;
import ingredients.ny.NYReggianoCheese;
import ingredients.ny.NYSlicedPepperoni;
import ingredients.ny.NYThinCrustDough;

// For each ingredient in the ingredient family, we create the New York version.
public class NYPizzaIngredientFactory implements PizzaIngredientFactory {
	@Override
	public Dough createDough() {
		return new NYThinCrustDough();
	}

	@Override
	public Sauce createSauce() {
		return new NYMarinaraSauce();
	}

	@Override
	public Cheese createCheese() {
		return new NYReggianoCheese();
	}

	@Override
	public Veggies[] createVeggies() {
		Veggies veggies[] = { new NYGarlic(), new NYOnion(), new NYMushroom() };
		return veggies;
	}

	@Override
	public Pepperoni createPepperoni() {
		return new NYSlicedPepperoni();
	}

	@Override
	public Clams createClam() {
		return new NYFreshClams();
	}
}