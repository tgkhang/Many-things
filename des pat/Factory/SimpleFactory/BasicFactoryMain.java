import Pizza.*;

public class BasicFactoryMain {
	public static void main(String[] args) {
		SimplePizzaFactory factory = new SimplePizzaFactory();
		BasicPizzaStore store = new BasicPizzaStore(factory);

		Pizza pizza = store.orderPizza("cheese");
		System.out.println("Ethan ordered a " + pizza.getClass().getName() + "\n");

		pizza = store.orderPizza("clam");
		System.out.println("Joel ordered a " + pizza.getClass().getName() + "\n");
	}
}