import pizza.Pizza;
import store.MyThoStylePizzaStore;
import store.NYStylePizzaStore;
import store.PizzaStore;

public class FactoryMethodMain {

	public static void main(String[] args) {
		PizzaStore nyStore = new NYStylePizzaStore();
		PizzaStore myThoStore = new MyThoStylePizzaStore();

		Pizza pizza = nyStore.orderPizza("cheese");
		System.out.println("Ethan ordered a " + pizza.getName() + "\n");

		pizza = myThoStore.orderPizza("cheese");
		System.out.println("Lan ordered a " + pizza.getName() + "\n");
	}

}