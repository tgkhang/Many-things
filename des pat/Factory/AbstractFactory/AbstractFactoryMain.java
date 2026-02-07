import pizza.Pizza;
import store.MyThoStylePizzaStore;
import store.NYStylePizzaStore;
import store.PizzaStoreAbstract;

public class AbstractFactoryMain {
	public static void main(String[] args) {
		PizzaStoreAbstract nyStore = new NYStylePizzaStore();
		PizzaStoreAbstract myThoStore = new MyThoStylePizzaStore();

		Pizza pizza = nyStore.orderPizza("cheese");
		System.out.println("Ethan ordered a " + pizza.getName() + "\n");

		pizza = myThoStore.orderPizza("cheese");
		System.out.println("Lan ordered a " + pizza.getName() + "\n");
	}

}