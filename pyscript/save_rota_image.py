import base64
import io
import os

@pyscript_executor
def _write_file(path: str, data: bytes) -> None:
    with io.open(path, "wb") as f:
        f.write(data)

def _guess_ext_and_mime(file_name: str):
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
    if ext in ("jpg", "jpeg"):
        return "jpg", "image/jpeg"
    if ext == "png":
        return "png", "image/png"
    if ext == "webp":
        return "webp", "image/webp"
    return "jpg", "image/jpeg"

@service
@task_unique("save_rota_image")
async def save_rota_image(file_data: str = None, file_name: str = None) -> None:
    """
    Save image to a known path: /config/www/rotas/latest_rota.<ext>
    """
    if not file_data or not file_name:
        raise ValueError("Both file_data and file_name are required.")

    ext, mime = _guess_ext_and_mime(file_name)
    target_dir = "/config/www/rotas"
    os.makedirs(target_dir, exist_ok=True)
    fixed_path = f"{target_dir}/latest_rota.{ext}"

    image_bytes = base64.b64decode(file_data)
    await _write_file(fixed_path, image_bytes)

    # Expose the known filename + mime as a state we can read easily
    state.set(
        "pyscript.latest_rota",
        f"latest_rota.{ext}",
        attributes={"mime_type": mime}
    )
