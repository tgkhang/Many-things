import Payment.CashPayment;
import Payment.CreditCardPayment;
import Payment.PayPalPayment;

public class StrategyPatternMain {
	public static void main(String[] args)
	{
		ShoppingCart cart = new ShoppingCart();

		// Pay with credit card
        cart.setPaymentStrategy(new CreditCardPayment("1234-5678-9012-3456"));
        cart.checkout(100.0);
        
        // Pay with PayPal
        cart.setPaymentStrategy(new PayPalPayment("user@example.com"));
        cart.checkout(50.0);
        
        // Pay with cash
        cart.setPaymentStrategy(new CashPayment());
        cart.checkout(25.0);
	}
}