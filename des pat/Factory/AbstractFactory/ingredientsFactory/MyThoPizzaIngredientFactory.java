package ingredientsFactory;

import ingredients.original.Cheese;
import ingredients.original.Clams;
import ingredients.original.Dough;
import ingredients.original.Pepperoni;
import ingredients.original.Sauce;
import ingredients.original.Veggies;
import ingredients.mytho.MyThoDicedPepperoni;
import ingredients.mytho.MyThoFrozenClams;
import ingredients.mytho.MyThoGarlic;
import ingredients.mytho.MyThoGreenPepper;
import ingredients.mytho.MyThoMozzarellaCheese;
import ingredients.mytho.MyThoMushroom;
import ingredients.mytho.MyThoOnion;
import ingredients.mytho.MyThoThickCrustDough;
import ingredients.mytho.MyThoTomatoSauce;

// MyTho style uses different ingredient variations with its own regional characteristics
public class MyThoPizzaIngredientFactory implements PizzaIngredientFactory {
	@Override
	public Dough createDough() {
		return new MyThoThickCrustDough();
	}

	@Override
	public Sauce createSauce() {
		return new MyThoTomatoSauce();
	}

	@Override
	public Cheese createCheese() {
		return new MyThoMozzarellaCheese();
	}

	@Override
	public Veggies[] createVeggies() {
		Veggies veggies[] = { new MyThoGarlic(), new MyThoOnion(), new MyThoMushroom(), new MyThoGreenPepper() };
		return veggies;
	}

	@Override
	public Pepperoni createPepperoni() {
		return new MyThoDicedPepperoni();
	}

	@Override
	public Clams createClam() {
		return new MyThoFrozenClams();
	}
}
