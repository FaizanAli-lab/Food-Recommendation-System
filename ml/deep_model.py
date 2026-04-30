"""
PyTorch Deep Learning Module
A 3-layer MLP that scores how well a food matches a user's profile.
Used to re-rank KNN candidates for higher accuracy recommendations.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Optional


class FoodMLP(nn.Module):
    """
    Multi-Layer Perceptron for food suitability scoring.
    Input:  food feature vector (12 dimensions)
    Output: suitability score in [0, 1]
    """

    def __init__(self, input_dim: int = 12):
        super(FoodMLP, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


def train_mlp(
    food_features: np.ndarray,
    labels: np.ndarray,
    epochs: int = 200,
    lr: float = 0.001,
) -> FoodMLP:
    """
    Train the MLP on food features with suitability labels.

    Args:
        food_features: (N, 12) array of food feature vectors
        labels:        (N,)    binary suitability labels (0 or 1)
        epochs:        training epochs
        lr:            learning rate

    Returns:
        Trained FoodMLP in eval mode
    """
    model = FoodMLP(input_dim=food_features.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    criterion = nn.BCELoss()

    X = torch.FloatTensor(food_features)
    y = torch.FloatTensor(labels.astype(float)).unsqueeze(1)

    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        output = model(X)
        loss = criterion(output, y)
        loss.backward()
        optimizer.step()

    model.eval()
    print(f"[PyTorch MLP] Trained for {epochs} epochs. Final loss: {loss.item():.4f}")
    return model


def score_foods_mlp(model: FoodMLP, food_features: np.ndarray) -> np.ndarray:
    """
    Score a batch of foods using the trained MLP.

    Args:
        model:         Trained FoodMLP
        food_features: (N, 12) feature array

    Returns:
        (N,) numpy array of suitability scores in [0, 1]
    """
    model.eval()
    with torch.no_grad():
        X = torch.FloatTensor(food_features)
        scores = model(X).squeeze()
        # Handle single-item case where squeeze() returns a scalar
        if scores.dim() == 0:
            scores = scores.unsqueeze(0)
        return scores.numpy()
