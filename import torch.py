import torch
import torch.nn as nn
import torch.nn.functional as F

# Neural network implementation
class XORNetwork(nn.Module):

    def __init__(self):
        super(XORNetwork, self).__init__()

        # two inputs -> two hidden neurons
        self.fc1 = nn.Linear(2, 2)

        # two hidden neurons -> one output
        self.fc2 = nn.Linear(2, 1)

    def forward(self, x):

        x = F.relu(self.fc1(x))
        print("Hidden layer output:", x.detach().cpu().numpy())

        x = F.relu(self.fc2(x))
        return x


model = XORNetwork()

# Disable gradient calculation
with torch.no_grad():

    # set weights for hidden layer
    model.fc1.weight.copy_(torch.tensor([[2.0, 2.0],
                                         [1.0, 1.0]]))

    model.fc1.bias.copy_(torch.tensor([-1.0, -1.0]))

    # set weights for output layer
    model.fc2.weight.copy_(torch.tensor([[1.0, -3.0]]))

    model.fc2.bias.copy_(torch.tensor([0.0]))


# Test inputs
inputs = [
    torch.tensor([0.0,0.0]),
    torch.tensor([1.0,1.0]),
    torch.tensor([1.0,0.0]),
    torch.tensor([0.0,1.0])
]

for x in inputs:
    print("Input:", x.numpy())
    print("Output:", model(x).detach().cpu().numpy())
    print()