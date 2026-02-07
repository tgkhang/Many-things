package Pizza;

public class ClamPizza implements Pizza {
	public void prepare() {
		System.out.println("Preparing Clam Pizza");
	}

	public void bake() {
		System.out.println("Baking Clam Pizza");
	}

	public void cut() {
		System.out.println("Cutting Clam Pizza");
	}

	public void box() {
		System.out.println("Boxing Clam Pizza");
	}
}