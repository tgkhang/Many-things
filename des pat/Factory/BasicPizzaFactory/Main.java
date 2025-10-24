
import Pizza.*;

public class Main {

	public static void main(String[] args) {
		SimplePizzaFactory factory = new SimplePizzaFactory();
		PizzaStore store = new PizzaStore(factory);

		Pizza pizza = store.orderPizza("cheese");
		System.out.println("Ethan ordered a " + pizza.getClass().getName() + "\n");

		pizza = store.orderPizza("clam");
		System.out.println("Joel ordered a " + pizza.getClass().getName() + "\n");
	}

}