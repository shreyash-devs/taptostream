import logging

import algokit_utils
import algosdk

logger = logging.getLogger(__name__)


# define deployment behaviour based on supplied app spec
def deploy() -> None:
    import os
    from pathlib import Path

    algorand = algokit_utils.AlgorandClient.from_environment()

    # Prefer explicit mnemonic-based deployer to avoid LocalNet KMD dependency issues.
    # Fallback to AlgoKit's conventional DEPLOYER account resolution.
    deployer_mnemonic = os.getenv("DEPLOYER_MNEMONIC") or os.getenv("PLATFORM_MNEMONIC")
    deployer_ = None
    if deployer_mnemonic:
        try:
            deployer_ = algorand.account.from_mnemonic(mnemonic=deployer_mnemonic)
        except Exception:
            logger.warning(
                "DEPLOYER_MNEMONIC/PLATFORM_MNEMONIC is present but invalid; falling back to LocalNet/KMD deployer."
            )

    if deployer_ is None:
        try:
            deployer_ = algorand.account.from_environment("DEPLOYER")
        except Exception:
            try:
                # Last-resort LocalNet fallback if DEPLOYER lookup via KMD wallet name fails.
                deployer_ = algorand.account.localnet_dispenser()
            except Exception as ex:
                raise Exception(
                    "Unable to resolve deployer account. Provide a valid 25-word DEPLOYER_MNEMONIC or "
                    "ensure LocalNet KMD is healthy."
                ) from ex

    # Puya template variables (compiled into the app during deployment).
    # Keep these names in sync with TemplateVar keys in the contract.
    tmpl_platform_wallet = os.getenv("TMPL_platform_wallet") or os.getenv("PLATFORM_WALLET")
    tmpl_usdc_asset_id = os.getenv("TMPL_usdc_asset_id") or os.getenv("USDC_ASA_ID")
    if not tmpl_platform_wallet:
        raise Exception("Missing TMPL_platform_wallet (or PLATFORM_WALLET) in environment")
    if not tmpl_usdc_asset_id:
        raise Exception("Missing TMPL_usdc_asset_id (or USDC_ASA_ID) in environment")

    app_spec_path = (
        Path(__file__).resolve().parents[1]
        / "artifacts"
        / "tap_to_stream"
        / "TapToStream.arc56.json"
    )
    app_spec = algokit_utils.Arc56Contract.from_json(app_spec_path.read_text(encoding="utf-8"))

    app_factory = algokit_utils.AppFactory(
        params=algokit_utils.AppFactoryParams(
            algorand=algorand,
            app_spec=app_spec,
            default_sender=deployer_.address,
        )
    )

    app_client, result = app_factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
        compilation_params=algokit_utils.AppClientCompilationParams(
            deploy_time_params={
                "platform_wallet": algosdk.encoding.decode_address(tmpl_platform_wallet),
                "usdc_asset_id": int(tmpl_usdc_asset_id),
            }
        ),
    )

    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=algokit_utils.AlgoAmount(algo=1),
                sender=deployer_.address,
                receiver=app_client.app_address,
            )
        )

    logger.info(f"Deployed {app_client.app_name} app_id={app_client.app_id} app_address={app_client.app_address}")
