package services

import (
	"fmt"
	"os"

	"github.com/Giriathallah/diro-pilates-backend/models"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
)

type MidtransService struct {
	Client snap.Client
	Core   coreapi.Client
}

func NewMidtransService() *MidtransService {
	var s snap.Client
	var c coreapi.Client

	// Set Environment from .env
	env := midtrans.Sandbox
	if os.Getenv("APP_ENV") == "production" {
		env = midtrans.Production
	}

	s.New(os.Getenv("MIDTRANS_SERVER_KEY"), env)
	c.New(os.Getenv("MIDTRANS_SERVER_KEY"), env)

	return &MidtransService{
		Client: s,
		Core:   c,
	}
}

func (s *MidtransService) GenerateSnapToken(reservation *models.Reservation, user *models.User) (string, string, error) {
	// Convert float amount to int64 required by Midtrans
	amount := int64(reservation.TotalAmount)

	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID: reservation.ID, // Gunakan Reservation ID sebagai Order ID sementara.
			// Note: Midtrans butuh unik order ID. Jika user retry payment, logic ini mungkin butuh suffix.
			GrossAmt: amount,
		},
		Expiry: &snap.ExpiryDetails{
			Unit:     "minute",
			Duration: 15,
		},
		CreditCard: &snap.CreditCardDetails{
			Secure: true,
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: user.Name,
			Email: user.Email,
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    reservation.ScheduleID,
				Name:  "Pilates Session",
				Price: int64(reservation.TotalAmount),
				Qty:   1,
			},
		},
	}
	fmt.Println("Using Midtrans Server Key:", os.Getenv("MIDTRANS_SERVER_KEY"))

	snapResp, err := s.Client.CreateTransaction(req)
	if err != nil {
		return "", "", err
	}

	return snapResp.Token, snapResp.RedirectURL, nil
}

func (s *MidtransService) VerifyTransaction(orderID string) (*coreapi.TransactionStatusResponse, error) {
	return s.Core.CheckTransaction(orderID)
}
