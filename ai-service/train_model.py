"""
MobileNetV2 Pothole Detection — Training Script

Usage:
    python train_model.py --data_dir /path/to/dataset --epochs 20

Dataset structure expected:
    dataset/
      train/
        pothole/    (images of potholes)
        no_pothole/ (images of normal road surface)
      val/
        pothole/
        no_pothole/

After training, weights are saved to model/weights/pothole_mobilenetv2.h5
The AI service will automatically load them on next startup.

Recommended datasets:
  - Kaggle: "Pothole Image Dataset"
  - Kaggle: "Road Damage Dataset"
"""

import argparse
import os

import tensorflow as tf

IMG_SIZE = (224, 224)
BATCH_SIZE = 32


def build_model():
    base = tf.keras.applications.MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False  # freeze base for phase 1

    x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    output = tf.keras.layers.Dense(1, activation="sigmoid")(x)

    return tf.keras.Model(inputs=base.input, outputs=output), base


def train(data_dir: str, epochs: int):
    train_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(data_dir, "train"),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="binary",
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(data_dir, "val"),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="binary",
    )

    # Normalise pixel values
    normalise = tf.keras.layers.Rescaling(1.0 / 255)
    train_ds = train_ds.map(lambda x, y: (normalise(x), y)).cache().prefetch(tf.data.AUTOTUNE)
    val_ds   = val_ds.map(lambda x, y: (normalise(x), y)).cache().prefetch(tf.data.AUTOTUNE)

    model, base = build_model()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )

    print("=== Phase 1: Training head (base frozen) ===")
    model.fit(train_ds, validation_data=val_ds, epochs=min(epochs // 2, 10))

    print("=== Phase 2: Fine-tuning last 30 layers ===")
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=max(epochs // 2, 10))

    weights_path = os.path.join("model", "weights", "pothole_mobilenetv2.h5")
    os.makedirs(os.path.dirname(weights_path), exist_ok=True)
    model.save_weights(weights_path)
    print(f"Weights saved to {weights_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", required=True, help="Path to dataset directory")
    parser.add_argument("--epochs", type=int, default=20, help="Total training epochs")
    args = parser.parse_args()
    train(args.data_dir, args.epochs)
