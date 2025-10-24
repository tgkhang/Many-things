package pizza;

import ingredientsFactory.PizzaIngredientFactory;

public class ClamPizza extends Pizza {
    PizzaIngredientFactory ingredientFactory;

    public ClamPizza(PizzaIngredientFactory ingredientFactory) {
        this.ingredientFactory = ingredientFactory;
    }


    //To make a clam pizza, the  prepare method collects the right ingredients from its local factory.
	@Override
	public void prepare() {
		System.out.println("Preparing " + name);
		dough = ingredientFactory.createDough();
		sauce = ingredientFactory.createSauce();
		cheese = ingredientFactory.createCheese();

		// If it's a New York factory, the clams will be fresh; if it's MyTho, they'll be frozen.
		clams = ingredientFactory.createClam();
	}
}
