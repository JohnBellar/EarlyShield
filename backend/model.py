import torch
import torch.nn as nn
from transformers import AutoTokenizer, XLMRobertaConfig, XLMRobertaModel
from pathlib import Path

class EarlyShieldModel(nn.Module):
    def __init__(self, model_name, num_risk_classes=3, num_tactics=8):
        super().__init__()

        config = XLMRobertaConfig.from_pretrained(model_name)
        self.encoder = XLMRobertaModel(config, add_pooling_layer=True)

        hidden_size = config.hidden_size
        self.risk_classifier = nn.Linear(hidden_size, num_risk_classes)
        self.tactic_classifier = nn.Linear(hidden_size, num_tactics)

    def forward(self, input_ids, attention_mask):
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )

        # First-token representation, matching the training architecture
        pooled = outputs.last_hidden_state[:, 0, :]

        risk_logits = self.risk_classifier(pooled)
        tactic_logits = self.tactic_classifier(pooled)

        return risk_logits, tactic_logits


class EarlyShieldInference:
    def __init__(self, checkpoint_path):
        self.device = torch.device("cpu")

        print(f"Loading EarlyShield on {self.device}...")

        checkpoint = torch.load(
            checkpoint_path,
            map_location="cpu",
            weights_only=False
        )

        self.model_name = checkpoint["model_name"]
        self.max_length = checkpoint["max_length"]
        self.risk_label_map = checkpoint["risk_label_map"]
        self.tactic_labels = checkpoint["manipulation_labels"]

        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

        self.model = EarlyShieldModel(
            model_name=self.model_name,
            num_risk_classes=len(self.risk_label_map),
            num_tactics=len(self.tactic_labels)
        )

        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

        self.risk_labels = {
            index: label
            for label, index in self.risk_label_map.items()
        }

        print("EarlyShield loaded successfully!")

    @torch.inference_mode()
    def predict(self, text):
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=self.max_length,
            padding="max_length"
        )

        inputs = {
            key: value.to(self.device)
            for key, value in inputs.items()
        }

        risk_logits, tactic_logits = self.model(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"]
        )

        risk_probs = torch.softmax(risk_logits, dim=1)[0]
        tactic_probs = torch.sigmoid(tactic_logits)[0]

        risk_index = int(torch.argmax(risk_probs).item())

        return {
            "text": text,
            "risk": self.risk_labels[risk_index],
            "risk_confidence": float(risk_probs[risk_index].item()),
            "risk_probabilities": {
                self.risk_labels[i]: float(risk_probs[i].item())
                for i in range(len(self.risk_labels))
            },
            "tactics": [
                {
                    "label": label,
                    "confidence": float(tactic_probs[i].item())
                }
                for i, label in enumerate(self.tactic_labels)
                if tactic_probs[i].item() >= 0.5
            ],
            "tactic_probabilities": {
                label: float(tactic_probs[i].item())
                for i, label in enumerate(self.tactic_labels)
            }
        }


if __name__ == "__main__":
    checkpoint_path = (
    Path(__file__).resolve().parent
    / "models"
    / "xlmr_unified_tanglish_best.pth"
)

    detector = EarlyShieldInference(checkpoint_path)

    test_messages = [
        "Your bank account will be blocked. Share your OTP immediately.",
        "Congratulations! You won a prize. Pay a processing fee to claim it.",
        "Hi, can you lend me 200 rupees for petrol?",
    ]

    for message in test_messages:
        print("\nMessage:", message)
        print(detector.predict(message))
