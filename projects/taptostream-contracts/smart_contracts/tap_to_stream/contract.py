from algopy import Account, ARC4Contract, GlobalState, TemplateVar, UInt64, arc4, itxn, log
from algopy.op import Global, Txn


class PaymentDistributed(arc4.Struct):
    video_id: arc4.String
    creator_address: arc4.Address
    creator_share: arc4.UInt64
    platform_share: arc4.UInt64


class TapToStream(ARC4Contract):
    def __init__(self) -> None:
        self.platform_wallet = GlobalState(TemplateVar[Account]("platform_wallet"))
        self.usdc_asset_id = GlobalState(TemplateVar[UInt64]("usdc_asset_id"))

    @arc4.abimethod()
    def make_payment(
        self,
        video_id: arc4.String,
        viewer_address: arc4.Address,
        usdc_amount: arc4.UInt64,
        creator_address: arc4.Address,
    ) -> arc4.Bool:
        assert Txn.sender == self.platform_wallet.value
        assert usdc_amount

        log(
            "payment|",
            video_id,
            "|",
            viewer_address,
            "|",
            usdc_amount,
            "|",
            creator_address,
            "|ts=",
            Global.latest_timestamp,
        )

        distribute_result = self.distribute_payment(
            video_id, viewer_address, usdc_amount, creator_address
        )
        assert distribute_result
        return arc4.Bool(True)

    @arc4.abimethod()
    def distribute_payment(
        self,
        video_id: arc4.String,
        viewer_address: arc4.Address,
        usdc_amount: arc4.UInt64,
        creator_address: arc4.Address,
    ) -> arc4.Bool:
        amount = usdc_amount.as_uint64()
        creator_share = (amount * UInt64(95)) // UInt64(100)
        platform_share = amount - creator_share

        itxn.submit_txns(
            itxn.AssetTransfer(
                xfer_asset=self.usdc_asset_id.value,
                asset_receiver=creator_address.native,
                asset_amount=creator_share,
            ),
            itxn.AssetTransfer(
                xfer_asset=self.usdc_asset_id.value,
                asset_receiver=self.platform_wallet.value,
                asset_amount=platform_share,
            ),
        )

        arc4.emit(
            PaymentDistributed(
                video_id=video_id,
                creator_address=creator_address,
                creator_share=arc4.UInt64(creator_share),
                platform_share=arc4.UInt64(platform_share),
            )
        )
        return arc4.Bool(True)

